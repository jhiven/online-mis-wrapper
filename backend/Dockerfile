FROM rust:1.83.0-bookworm

WORKDIR /service/backend
COPY ./target/release/online_mis_backend .
COPY ./scripts ./scripts

EXPOSE 8080

ENV REDIS_ADDRESS=redis:6379
ENV REDIS_PASSWORD=123
ENV REDIS_USER=default
ENV PROXY_URL=socks5://127.0.0.1:1337

CMD [ "bash", "-c", "ssh -i ./scripts/key -D 1337 -C -f -q -N -o StrictHostKeyChecking=accept-new falcon@; ./online_mis_backend" ]
