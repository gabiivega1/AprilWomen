import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cusxvbdmvmmezfxdvnfg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1c3h2YmRtdm1tZXpmeGR2bmZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDIyNDUsImV4cCI6MjA5NzI3ODI0NX0.Gac1WFbbHFokjwvwcwGFMeayuX2mvTGHJmRCFUK04E0'

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)