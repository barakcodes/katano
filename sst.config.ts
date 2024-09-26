/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
    app(input) {
        return {
            name: "katano",
            removal: input?.stage === "production" ? "retain" : "remove",
            home: "aws",
        };
    },
    async run() {
        const table = new sst.aws.Dynamo("MyTable", {
            fields: {
                pk: "string",
            },
            primaryIndex: { hashKey: "pk" },
        });

        const sessionSecret = new sst.Secret(
            "SessionSecret",
            "some-special-secret",
        );

        const dlq = new sst.aws.Queue("DLQ");
        const queue = new sst.aws.Queue("Queue", {
            dlq: dlq.arn,
        });
        queue.subscribe({
            handler: "functions/evaluate_choice.handler",
            link: [table, queue],
        });

        new sst.aws.Remix("MyWeb", {
            environment: {
                NODE_ENV: $dev ? "development" : "production",
            },
            link: [table, queue, sessionSecret],
        });
    },
});
