"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const loginSchema = z.object({
  email: z.string().email({ message: "Por favor ingrese un correo válido." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
})

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  useEffect(() => {
    const supabase = getSupabase()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/cronograma-trade")
      }
    })
  }, [router])

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setLoading(true)
    setError(null)
    const supabase = getSupabase()

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    setLoading(false)

    if (error) {
      setError("Credenciales inválidas. Por favor, revise su correo y contraseña.")
    } else {
      toast({
        title: "Inicio de sesión exitoso",
        description: "Redirigiendo al panel de control...",
      })
      router.push("/cronograma-trade")
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Iniciar Sesión</CardTitle>
        <CardDescription>
          Ingrese su correo electrónico y contraseña para acceder a su cuenta.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error && (
            <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar sesión
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <div className="text-sm">
          <Link
            href="/reset-password"
            className="text-sm underline underline-offset-4 hover:text-primary"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div className="text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link
            href="/signup"
            className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Regístrate
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
