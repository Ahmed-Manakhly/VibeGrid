import Link from 'next/link'

export default function NotFound() {
    return (
        <div className='flex justify-start flex-col items-center text-balance font-semibold rounded-lg bg-muted/50 m-10 p-10 border gap-2'>
            <h1 className='text-xl'>Not Found</h1>
            <p>404 | Could not find requested resource!</p>
            <Link href="/" className='text-muted-foreground mt-5 text-sm'>Return to Home Page</Link>
        </div>
    )
}