import AlbumViewer from '@/components/AlbumViewer'
export default function AlbumPage({ params }: { params: { albumId: string } }) {
  return <AlbumViewer albumId={params.albumId} />
}
