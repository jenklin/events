import { NextResponse } from 'next/server'
export async function GET(_: Request, { params }: { params: { uid: string } }) {
  return NextResponse.redirect(`https://videodelivery.net/${params.uid}/manifest/video.m3u8`)
}
