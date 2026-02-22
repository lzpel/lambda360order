FROM public.ecr.aws/lambda/provided:al2023 AS base
# builder
FROM base AS builder
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
RUN dnf install -y gcc
COPY . .
RUN sh -c ". $HOME/.cargo/env && cargo build --release"
RUN find target/release -maxdepth 1 -type f -executable | xargs -IX install -D X -t target/bin/
# runner
FROM base AS runner
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.3 /lambda-adapter /opt/extensions/lambda-adapter
ENV PORT=8080
ENV AWS_LWA_INVOKE_MODE=response_stream
COPY --from=builder /var/task/target/bin/. ./
ENTRYPOINT ./sandbox-stream-api
