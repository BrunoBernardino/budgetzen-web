FROM denoland/deno:alpine-2.1.2

EXPOSE 8000

WORKDIR /app

# Prefer not to run as root.
USER deno

# These steps will be re-run upon each file change in your working directory:
ADD . /app

# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache --reload main.ts

ENTRYPOINT [ "sh", "entrypoint.sh" ]

CMD ["run", "--allow-all", "main.ts"]
