FROM rust:1.80 as builder
WORKDIR /usr/src/app
COPY . .
RUN cargo install --path .

FROM debian:bookworm-slim
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4 /lambda-adapter /opt/extensions/lambda-adapter
COPY --from=builder /usr/local/cargo/bin/api /usr/local/bin/api
CMD ["/usr/local/bin/api"]
