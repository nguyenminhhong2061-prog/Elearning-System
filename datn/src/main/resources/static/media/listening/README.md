# Listening audio

The seed lesson expects the R2 object key `media/listening/airport.mp3`.

For local development, place the licensed audio file in this directory as `airport.mp3`.
For Cloudflare R2, upload it to the `learning-audio` bucket with that exact object key. When `R2_ENABLED=true`,
the backend streams it through `/media/r2/<object-key>` using the bucket-scoped, read-only S3 API credentials
from the repository-root `.env`.

The file is intentionally not committed until the team has confirmed its source and redistribution licence.

The frontend should use the backend audio URL; it does not need direct public access to the R2 object.
The R2 public development URL can remain disabled when using the backend proxy.

```text
/media/r2/media/listening/airport.mp3
```
