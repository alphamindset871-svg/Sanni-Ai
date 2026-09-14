import { experimental_generateVideo as generateVideo } from 'ai';

export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, ratio = '16:9 Landscape', quality = 'Standard' } = req.body || {};

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const aspectRatio = ratio.includes('9:16')
      ? '9:16'
      : ratio.includes('1:1')
        ? '1:1'
        : '16:9';

    const resolution = quality === 'HD' ? '1920x1080' : '1280x720';

    const result = await generateVideo({
      model: 'alibaba/wan-v2.7-t2v',
      prompt: prompt.trim(),
      duration: 5,
      resolution,
      generateAudio: true,
      providerOptions: {
        alibaba: {
          ratio: aspectRatio,
          watermark: false,
          promptExtend: true,
          pollIntervalMs: 5000,
          pollTimeoutMs: 50000,
        },
      },
    });

    const video = result?.videos?.[0];

    if (!video) {
      return res.status(502).json({
        error: 'Video was generated but no video was returned.'
      });
    }

    const bytes = video.uint8Array || video.bytes;

    if (!bytes) {
      return res.status(502).json({
        error: 'Video data was empty.'
      });
    }

    const base64 = Buffer.from(bytes).toString('base64');

    return res.status(200).json({
      videoUrl: `data:video/mp4;base64,${base64}`,
      aspect_ratio: aspectRatio,
      duration: 5,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err?.message || 'Video generation failed.',
    });
  }
}
