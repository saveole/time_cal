import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            时间管理 - Time Management System
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            现代化的时间追踪与生产力管理工具
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="mb-4">
              开始使用
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>睡眠追踪</CardTitle>
              <CardDescription>
                记录和分析您的睡眠模式，改善睡眠质量
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                智能睡眠记录，模式分析，质量评估
              </p>
              <Button variant="outline" className="w-full">
                了解更多
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>活动管理</CardTitle>
              <CardDescription>
                追踪日常活动，优化时间分配
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                分类管理，模板功能，实时计时
              </p>
              <Button variant="outline" className="w-full">
                了解更多
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>统计分析</CardTitle>
              <CardDescription>
                深度数据分析，洞察时间使用规律
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                可视化图表，趋势分析，目标追踪
              </p>
              <Button variant="outline" className="w-full">
                了解更多
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">现代化技术栈</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-3 py-1 bg-secondary rounded-full text-sm">Next.js</span>
            <span className="px-3 py-1 bg-secondary rounded-full text-sm">React</span>
            <span className="px-3 py-1 bg-secondary rounded-full text-sm">TypeScript</span>
            <span className="px-3 py-1 bg-secondary rounded-full text-sm">Tailwind CSS</span>
            <span className="px-3 py-1 bg-secondary rounded-full text-sm">Supabase</span>
            <span className="px-3 py-1 bg-secondary rounded-full text-sm">shadcn/ui</span>
          </div>
        </div>
      </div>
    </main>
  )
}