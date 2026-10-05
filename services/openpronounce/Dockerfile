FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/models/huggingface \
    OPENPRONOUNCE_CACHE_DIR=/models/cache

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ffmpeg espeak-ng libsndfile1 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

ARG OPENPRONOUNCE_REF=main
RUN git clone https://github.com/Halleck45/OpenPronounce.git /opt/OpenPronounce \
    && git -C /opt/OpenPronounce checkout "${OPENPRONOUNCE_REF}"

WORKDIR /opt/OpenPronounce
RUN python -m pip install --upgrade pip \
    && python -m pip install --index-url https://download.pytorch.org/whl/cpu "torch>=2.0" \
    && python -m pip install ".[app]"

EXPOSE 8000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
