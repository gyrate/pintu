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

// 辅助函数：按月聚合数据（最近 N 个月）
async function getMonthlyTrendData(table: string, timeField: string, months: number = 12) {
    // 获取起始时间
    const start = new Date();
    start.setMonth(start.getMonth() - (months - 1)); // - (N-1) 是因为当前月也算一个月
    start.setDate(1); // 从该月 1 号开始
    start.setHours(0, 0, 0, 0);

    const { data, error } = await supabaseAdmin
        .from(table)
        .select(timeField)
        .gte(timeField, start.toISOString());

    if (error) {
        console.warn(`getMonthlyTrendData failed for ${table}:`, error.message);
        return [];
    }
    if (!data) return [];

    const map = new Map<string, number>();
    
    // 初始化最近 N 个月
    for (let i = 0; i < months; i++) {
        const d = new Date(start);
        d.setMonth(d.getMonth() + i);
        const key = d.toISOString().slice(0, 7); // YYYY-MM
        map.set(key, 0);
    }

    data.forEach((item: any) => {
        const dateStr = new Date(item[timeField]).toISOString().slice(0, 7); // YYYY-MM
        if (map.has(dateStr)) {
            map.set(dateStr, (map.get(dateStr) || 0) + 1);
        }
    });

    return Array.from(map.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

router.get('/stats', async (req, res) => {
    try {
        const { range, taskRange } = req.query; // 获取 range (图片) 和 taskRange (任务) 参数
        const imageMonths = range ? parseInt(range as string, 10) : 12;
        const taskDays = taskRange ? parseInt(taskRange as string, 10) : 30;

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
        const [taskTrend, imageMonthlyTrend] = await Promise.all([
            getTrendData('tasks', 'created_at', taskDays),
            getMonthlyTrendData('images', 'created_at', imageMonths)
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
                images: imageMonthlyTrend
            }
        });

    } catch (error: any) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
