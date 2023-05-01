Simple Cloudflare worker which utilizes cron-functionality. A part of Flying-pigs project.

It's main purpose is to periodically fetch state vectors from [OpenSky API](https://openskynetwork.github.io/opensky-api/) and send reponse to an existing RabbitMQ queue. 

It also needs a `wrangler.toml` file (excluded from git). See example below

```
name = "flying-pigs-rabbitmq-publisher"
main = "src/index.ts"
compatibility_date = "2023-04-23"

kv_namespaces = [
  { binding = "FLYING_PIGS_KV", id = "..." }
]

[triggers]
crons = [ "*/1 * * * *" ]
```