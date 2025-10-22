'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">今日概览</h1>
        <p className="text-muted-foreground">
          Track your time and manage your daily activities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>睡眠状态</CardTitle>
            <CardDescription>Today&apos;s sleep tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold mb-2">8h 15m</p>
            <p className="text-sm text-muted-foreground">Good sleep quality</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>工作时长</CardTitle>
            <CardDescription>Today&apos;s work hours</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold mb-2">6h 30m</p>
            <p className="text-sm text-muted-foreground">2h 30m to goal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>空闲时长</CardTitle>
            <CardDescription>Leisure time today</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold mb-2">3h 15m</p>
            <p className="text-sm text-muted-foreground">Well balanced</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>今日进度</CardTitle>
            <CardDescription>Daily completion rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-primary rounded-full" style={{ width: '72%' }}></div>
              </div>
            </div>
            <p className="text-2xl font-bold">72%</p>
            <p className="text-sm text-muted-foreground">Keep going!</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button className="flex-1 sm:flex-none">
          记录起床
        </Button>
        <Button variant="outline" className="flex-1 sm:flex-none">
          记录睡觉
        </Button>
        <Button variant="outline" className="flex-1 sm:flex-none">
          记录活动
        </Button>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Recent Activities</h2>
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">编程工作</h3>
                  <p className="text-sm text-muted-foreground">Work • 9:00 AM - 11:30 AM</p>
                </div>
                <span className="text-lg font-medium">2h 30m</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">休息时间</h3>
                  <p className="text-sm text-muted-foreground">Personal • 11:30 AM - 12:00 PM</p>
                </div>
                <span className="text-lg font-medium">30m</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">项目开发</h3>
                  <p className="text-sm text-muted-foreground">Work • 1:00 PM - 4:00 PM</p>
                </div>
                <span className="text-lg font-medium">3h 00m</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}