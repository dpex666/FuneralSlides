export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startPreviewWorker } = await import('./lib/workers/previewWorker')
    const { startExportWorker } = await import('./lib/workers/exportWorker')
    startPreviewWorker()
    startExportWorker()
    console.log('[PassingMoments] BullMQ workers started')
  }
}
