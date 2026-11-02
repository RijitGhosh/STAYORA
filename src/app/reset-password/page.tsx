import { Suspense } from "react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ResetPasswordForm from "@/app/reset-password/ResetPasswordForm"

export const metadata = { title: "Set a new password — Stayora" }

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-warmWhite">
      <Header />
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Set a new password</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<p className="text-sm text-secondaryText">Loading…</p>}>
              <ResetPasswordForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}
