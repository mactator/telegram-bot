import fastify from 'fastify'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'

const supabaseUrl = 'https://xaxhsawmdioikfwkpbva.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhheGhzYXdtZGlvaWtmd2twYnZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTI0NTM0MzMsImV4cCI6MjAwODAyOTQzM30.mnP4E_lzXmh04y9ZdnZOqynbs8z2A-p0vGehQbg1MpM"
const supabase = createClient(supabaseUrl, supabaseKey)

const server = fastify({logger:false})

server.post('/signup', async (request, reply) => {
    const { email, password } = request.body as { email: string, password: string }
    
    let { data, error } = await supabase.auth.signUp({
    email,
    password
})
if(error){
    reply.code(400).send(error.message)
}
return { email, password }

})

server.post('/signin', async (request, reply) => {
    const { email, password } = request.body as { email: string, password: string }
    let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })
    if(error){
        reply.code(400).send(error.message  + ", we dont have an account with these info " )
    }
    return { status: 'logged in',session:{} }
    })

server.get('/*', async (request, reply) => {
    reply.code(404).send('Not Found\n')
})

server.get('/system/calendar/callback', async (request, reply) => {
    const {code} = request.query as {code: string}

    const client = createOauthClient();
    
    const {refresh_token} = await client.getToken(code) as unknown as {refresh_token: string}
    
    
    const { data:session, error: sessionError } = await supabase.auth.getSession()
    const { data: user, error: userError } = await supabase.auth.getUser(session.session?.access_token)
    const { data, error } = await supabase
    .from('user_token')
    .insert([
    { user_id: user.user?.id, refresh_token },
    ])
    .select()
    if(error){
        reply.code(400).send(error.message)
    }
    return { status: 'token has been saved',session:{}, refresh_token: refresh_token }

})

server.get('/oauth', async (request, reply) => {
    const client = createOauthClient()
    const url = client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/calendar'})
    
    reply.redirect(url)
    })




server.listen({ port: 3000 }, (err, address) => {
if (err) {
    console.error(err)
    process.exit(1)
}
console.log(`Server listening at ${address}`)
})


function createOauthClient() {
    return new google.auth.OAuth2(
        '583680355112-s7fo8ra2nfg5npp6h8bnp188c4845q1g.apps.googleusercontent.com',
        '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',
        'http://localhost:3000/system/calendar/callback'

    )
}