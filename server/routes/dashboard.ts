import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

// 辅助函数：获取时间范围
const getDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return { start, end };
};

// 辅助函数：按时间聚合数据 (简化版，按天)
// 注意：这里为了简化实现，我们获取原始数据后在内存中聚合。
// 对于大规模数据，应该使用 SQL Group By。但 Supabase JS Client 对 Group By 支持较弱，通常需要 RPC。
// 考虑到当前数据量不大，内存聚合是可行的。
async function getTrendData(table: string, timeField: string, days: number) {
    const { start } = getDateRange(days);
    
    // 获取时间范围内的所有记录时间戳
    const { data, error } = await supabaseAdmin
        .from(table)
        .select(timeField)
        .gte(timeField, start.toISOString());

    if (error) {
        // 如果是表不存在等错误，降级处理，返回空数据
        console.warn(`getTrendData failed for ${table}:`, error.message);
        return [];
    }
    if (!data) return [];

    // 按天聚合
    const map = new Map<string, number>();
    
    // 初始化每一天，确保数据连续（可选，这里先只统计有数据的天）
    // 为了前端图表好看，最好补全日期。
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        map.set(key, 0);
    }

    data.forEach((item: any) => {
        const dateStr = new Date(item[timeField]).toISOString().split('T')[0];
        if (map.has(dateStr)) {
            map.set(dateStr, (map.get(dateStr) || 0) + 1);
        }
    });

    // 转换为数组并按日期排序
    return Array.from(map.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

router.get('/stats', async (req, res) => {
    try {
        // 1. 基础计数 (Total Counts)
        // 使用 head: true 来只获取 count，不拉取数据
        const [
            { count: usersCount },
            { count: tasksCount },
            { count: imagesCount },
            { count: resultsCount }
        ] = await Promise.all([
            supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('images').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true })
                .eq('status', 'completed')
                .not('export_url', 'is', null)
        ]);

        // 2. 趋势数据 (Trends)
        // 默认获取最近 30 天的数据
        const days = 30;
        const [taskTrend, loginTrend] = await Promise.all([
            getTrendData('tasks', 'created_at', days),
            getTrendData('login_logs', 'login_at', days)
        ]);

        res.json({
            counts: {
                users: usersCount || 0,
                tasks: tasksCount || 0,
                images: imagesCount || 0,
                results: resultsCount || 0
            },
            trends: {
                tasks: taskTrend,
                logins: loginTrend
            }
        });

    } catch (error: any) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
