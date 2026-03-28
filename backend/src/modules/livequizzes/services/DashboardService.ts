import { injectable } from 'inversify';
import { Room } from '../../../shared/database/models/Room.js';
import UserAchievement from '#root/shared/database/models/UserAchievement.js';
import Badge from '#root/shared/database/models/Badge.js';
import UserRoomStats from '#root/shared/database/models/UserRoomStats.js';

@injectable()
export class DashboardService {
    async getStudentDashboardData(studentId: string) {
        const joinedRooms = await Room.find({ joinedStudents: studentId }).lean();
        const userAchievements = await UserAchievement.find({ userId: studentId }).populate('badgeId').lean();

        let totalPolls = 0;
        let takenPolls = 0;
        let absentPolls = 0;
        let unattemptedPolls = 0;
        let totalScore = 0;
        let totalMaxPoints = 0;
        let totalCorrect = 0;
        let totalIncorrect = 0;
        let totalResponseTime = 0;

        let pollResults: any[] = [];
        let pollDetails: any[] = [];
        let activePolls: any[] = [];
        let upcomingPolls: any[] = [];
        let scoreProgression: any[] = [];
        let roomWiseScores: any[] = [];

        for (const room of joinedRooms) {
            let roomScore = 0;
            let roomMaxPoints = 0;
            let attendedPolls = 0;
            let roomUnattemptedPolls = 0;
            let roomResponseTime = 0;
            let roomCorrect = 0;

            for (const poll of room.polls ?? []) {
                totalPolls++;

                const answer = poll.answers?.find((a: any) => a.userId === studentId);
                if (answer) {
                    takenPolls++;
                    attendedPolls++;

                    const score = answer.points ?? 0;
                    const maxPoints = poll.maxPoints ?? 20;
                    roomScore += score;
                    roomMaxPoints += maxPoints;
                    totalScore += score;
                    totalMaxPoints += maxPoints;

                    // Accuracy & Timing
                    const isCorrect = poll.correctOptionIndex === answer.answerIndex;
                    if (isCorrect) {
                        totalCorrect++;
                        roomCorrect++;
                    } else {
                        totalIncorrect++;
                    }

                    // Calculate response time if not stored directly
                    // In current schema, points reflect timing, but let's try to infer or use average if available
                    // Assuming answeredAt and poll.createdAt are available as per PollService.ts
                    if (answer.answeredAt && poll.createdAt) {
                        const rTime = (new Date(answer.answeredAt).getTime() - new Date(poll.createdAt).getTime()) / 1000;
                        totalResponseTime += rTime;
                        roomResponseTime += rTime;
                    }

                    pollResults.push({
                        name: poll.question || 'Untitled Poll',
                        score,
                        maxPoints: maxPoints,
                        points: answer.points ?? 0,
                        date: poll.createdAt || new Date(),
                        isCorrect,
                        timer: poll.timer,
                        type: 'MCQ'
                    });

                    scoreProgression.push({
                        poll: poll.question || 'Poll',
                        score: answer.points ?? 0,
                        maxPoints: poll.maxPoints ?? 20
                    });
                } else {
                    if (!(poll.lockedActiveUsers ?? []).includes(studentId)) {
                        absentPolls++;
                    } else {
                        unattemptedPolls++;
                        roomUnattemptedPolls++;
                        const maxPoints = poll.maxPoints ?? 20;
                        roomMaxPoints += maxPoints;
                        totalMaxPoints += maxPoints;

                        pollResults.push({
                            name: poll.question || 'Untitled Poll',
                            score: 0,
                            maxPoints: maxPoints,
                            points: 0,
                            date: poll.createdAt || new Date(),
                            isCorrect: false,
                            timer: poll.timer,
                            type: 'MCQ'
                        });

                        scoreProgression.push({
                            poll: poll.question || 'Poll',
                            score: 0,
                            maxPoints: poll.maxPoints ?? 20
                        });
                    }
                }

                if (room.status === 'active') {
                    activePolls.push({
                        name: poll.question || 'Active Poll',
                        status: 'Ongoing'
                    });
                }
            }

            if (attendedPolls > 0 || roomUnattemptedPolls > 0 || room.status === 'active') {
                const avgScore = roomMaxPoints > 0 ? Math.round((roomScore / roomMaxPoints) * 100) : 0;
                const roomBadges = userAchievements.filter(a => a.roomCode === room.roomCode);

                roomWiseScores.push({
                    roomName: room.name,
                    roomCode: room.roomCode,
                    totalPolls: room.polls.length,
                    attendedPolls,
                    taken: attendedPolls,
                    score: roomScore,
                    maxPossiblePoints: roomMaxPoints,
                    avgScore,
                    averageScore: `${avgScore}%`,
                    avgResponseTime: attendedPolls > 0 ? (roomResponseTime / attendedPolls).toFixed(2) : 0,
                    badgesCount: roomBadges.length,
                    status: room.status,
                    createdAt: room.createdAt
                });
            }
        }

        const avgScore = totalMaxPoints > 0 ? Math.round((totalScore / totalMaxPoints) * 100) : 0;
        const participationRate = totalPolls > 0 ? `${Math.round((takenPolls / totalPolls) * 100)}%` : '0%';
        const avgResponseTime = takenPolls > 0 ? (totalResponseTime / takenPolls).toFixed(2) : "0";

        // Achievement Highlights
        const recentAchievements = userAchievements
            .sort((a, b) => new Date(b.earnedAt || 0).getTime() - new Date(a.earnedAt || 0).getTime())
            .slice(0, 5);

        // Upcoming Badge logic (Improved)
        const allBadges = await Badge.find().lean();
        const earnedBadgeIds = new Set(userAchievements.map(a => (a.badgeId as any)?._id?.toString()));

        let upcomingBadge: any = null;
        let bestProgress = -1;

        for (const badge of allBadges) {
            if (earnedBadgeIds.has(badge._id.toString())) continue;

            let current = 0;
            const threshold = badge.rule?.threshold || 1;

            switch (badge.rule?.type) {
                case 'correct_answers': current = totalCorrect; break;
                case 'questions_answered': current = takenPolls; break;
                case 'accuracy': current = avgScore; break;
                case 'fast_response': current = 0; break; // Hard to track upcoming for speed
                default: current = 0;
            }

            const progress = Math.min(Math.round((current / threshold) * 100), 99);

            if (progress > bestProgress) {
                bestProgress = progress;
                upcomingBadge = { ...badge, progress };
            }
        }

        // If no specifically high progress badge, just pick the first unearned one
        if (!upcomingBadge && allBadges.length > 0) {
            upcomingBadge = allBadges.find(b => !earnedBadgeIds.has(b._id.toString()));
            if (upcomingBadge) upcomingBadge.progress = 0;
        }

        return {
            pollStats: {
                total: totalPolls,
                taken: takenPolls,
                absent: absentPolls,
                unattempted: unattemptedPolls,
                earnedPoints: totalScore,
                correctAnswers: totalCorrect,
                incorrectAnswers: totalIncorrect,
                avgResponseTime
            },
            pollResults,
            activePolls,
            upcomingPolls,
            scoreProgression,
            performanceSummary: {
                avgScore: `${avgScore}%`,
                participationRate,
                avgResponseTime,
                bestSubject: 'N/A'
            },
            achievements: {
                totalEarned: userAchievements.length,
                recentAchievements,
                upcomingBadge
            },
            roomWiseScores
        };
    }

    async getTeacherDashboardData(teacherId: string) {
        const rooms = await Room.find({ teacherId }).lean();

        let totalPolls = 0;
        let totalResponses = 0;
        let activeRooms: any[] = [];
        let recentRooms: any[] = [];
        let responsesPerRoom: { roomName: string, totalResponses: number }[] = [];

        for (const room of rooms) {
            const pollCount = room.polls?.length || 0;
            const responseCount = room.polls?.reduce((sum, poll) => sum + (poll.answers?.length || 0), 0) || 0;
            totalPolls += pollCount;
            totalResponses += responseCount;

            const roomData = {
                roomName: room.name,
                roomCode: room.roomCode,
                createdAt: room.createdAt,
                status: room.status,
                totalPolls: pollCount,
                totalResponses: responseCount,
            };

            if (room.status === 'active') {
                activeRooms.push(roomData);
            }

            recentRooms.push(roomData);

            responsesPerRoom.push({
                roomName: room.name,
                totalResponses: responseCount
            });
        }

        // Sort recentRooms and activeRooms by createdAt descending
        recentRooms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        activeRooms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        responsesPerRoom.sort((a, b) => b.totalResponses - a.totalResponses); // Optional: Sort descending

        const participationRate = totalPolls > 0 ? `${Math.round((totalResponses / totalPolls) * 100)}%` : '0%';

        return {
            summary: {
                totalAssessmentRooms: rooms.length,
                totalPolls,
                totalResponses,
                participationRate
            },
            activeRooms,
            recentRooms,
            responsesPerRoom,
            faqs: [
                { question: "How to create a room?", answer: "Click on 'Create Room' button from the dashboard." },
                { question: "How are scores calculated?", answer: "Each correct answer gives 20 points." }
            ]
        };
    }

    //get user achievement progress
    async getUserAchievementProgress(userId: string) {
        const [earnedBadgeIds, totalBadges] = await Promise.all([
            UserAchievement.distinct('badgeId', { userId }),
            Badge.countDocuments(),
        ]);

        const earned = earnedBadgeIds.length;
        const percent = totalBadges > 0 ? Math.round((earned / totalBadges) * 100) : 0;

        return {
            earned,
            total: totalBadges,
            percent,
        };
    }
}
