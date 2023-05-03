import { Toucan } from 'toucan-js';
import { IEnvironment } from "./interfaces/IEnvironment";
import { IStatesResponse } from "./interfaces/IStatesResponse";

export default {
	async scheduled(
		controller: ScheduledController,
		env: IEnvironment,
		ctx: ExecutionContext
	): Promise<void> {
		const sntryDsn: string = await env.FLYING_PIGS_KV.get('sentry_dsn') || '';
		const sentry = new Toucan({
			dsn: sntryDsn,
			release: '1.0.0',
		});

		const rabbitMqUser = await env.FLYING_PIGS_KV.get('rabbitmq_user');
		const rabbitMqPass = await env.FLYING_PIGS_KV.get('rabbitmq_pass');
		const rabbitMqHost = await env.FLYING_PIGS_KV.get('rabbitmq_host');
		const rabbitMqExchange = await env.FLYING_PIGS_KV.get('rabbitmq_exchange');

		const statesResponse = await fetch('https://opensky-network.org/api/states/all')

		if (!statesResponse.ok) {
			sentry.captureException(new Error(`Failed to fetch states from OpenSky: error ${statesResponse.status} - ${statesResponse.statusText}`));
			return;
		}

		const statesData: IStatesResponse = await statesResponse.json();

		console.log(`Publishing message with ${statesData.states.length} to RabbitMQ: ${rabbitMqHost}`);

		const response = await fetch(`${rabbitMqHost}/api/exchanges/%2f/${rabbitMqExchange}/publish`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${btoa(`${rabbitMqUser}:${rabbitMqPass}`)}`,
			},
			body: JSON.stringify({
				properties: {},
				routing_key: "opensky",
				payload: JSON.stringify(statesData),
				payload_encoding: 'string',
			}),
		})

		if (!response.ok) {
			sentry.captureException(new Error(`Failed to publish message to RabbitMQ: error ${response.status} - ${response.statusText}`));
		}
	},
};
