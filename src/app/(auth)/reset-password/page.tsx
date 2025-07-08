"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { getSupabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"

const resetSchema = z.object({
  email: z.string().email({ message: "Por favor ingrese un correo válido." }),
})

export default function ResetPasswordPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(values: z.infer<typeof resetSchema>) {
    setLoading(true)
    const supabase = getSupabase()

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
    })

    setLoading(false)

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar el correo de recuperación. Inténtelo de nuevo.",
      })
    } else {
      setSubmitted(true)
      toast({
        title: "Correo enviado",
        description: "Si el correo está registrado, recibirá un enlace para restablecer su contraseña.",
      })
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Recuperar Contraseña</CardTitle>
        <CardDescription>
          Ingrese su correo electrónico y le enviaremos un enlace para restablecer su contraseña.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {submitted ? (
            <Alert variant="default" className="border-green-500 bg-green-50 text-green-800">
                <AlertDescription>
                    Se ha enviado el enlace de recuperación. Por favor, revise su bandeja de entrada (y la carpeta de spam).
                </AlertDescription>
            </Alert>
        ) : (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                        <Input placeholder="nombre@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar enlace de recuperación
                </Button>
            </form>
            </Form>
        )}
      </CardContent>
      <CardFooter>
        <div className="text-sm">
          <Link
            href="/login"
            className="text-sm underline underline-offset-4 hover:text-primary"
          >
            Volver a Iniciar Sesión
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
