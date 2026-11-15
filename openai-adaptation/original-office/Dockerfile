# Separate opt-in original visual-shell build. Context: this directory only.
FROM node:22.16.0-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 OFFICE_VIDEO_DATA_DIR=/data/video
RUN mkdir -p /data/video && chown node:node /data /data/video && chmod 700 /data /data/video
COPY --chown=node:node server.mjs start.mjs agents-display.json ./
COPY --chown=node:node public/ ./public/
COPY --chown=node:node video/ ./video/
COPY --chown=node:node production/reference-standard.mjs ./production/reference-standard.mjs
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "require('http').get('http://127.0.0.1:3000/health',r=>{r.resume();process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"
CMD ["node","start.mjs"]
