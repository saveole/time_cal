'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MigrationWizard } from '@/components/migration/migration-wizard'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Database } from 'lucide-react'

export default function MigrationPage() {
  const router = useRouter()
  const [showWizard, setShowWizard] = useState(true)

  const handleMigrationComplete = () => {
    setShowWizard(false)
    // Redirect to dashboard after a short delay
    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {showWizard ? (
            <MigrationWizard onComplete={handleMigrationComplete} />
          ) : (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Database className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>迁移完成！</CardTitle>
                <CardDescription>
                  您的数据已成功迁移到云端
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  现在您可以在任何设备上访问您的数据，所有更改都会自动同步。
                </p>
                <Button onClick={() => router.push('/dashboard')}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  开始使用应用
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}