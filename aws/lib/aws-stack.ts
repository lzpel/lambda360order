import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { aws_s3, aws_ses, aws_iam } from 'aws-cdk-lib';

export class AwsStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// Lambda関数（../api ディレクトリのDockerイメージ使うで）
		// イメージの中で AWS Lambda Web Adapter 使ってるわ
		const { lambda: apiFunction, lambda_url: functionUrl } = docker_image_function(
			this,
			"ApiFunction",
			path.join(__dirname, "..", "..", "api"),
			{
				timeout: cdk.Duration.minutes(15),
				memorySize: 2048,
			},
			{
				cors: {
					allowedMethods: [lambda.HttpMethod.ALL],
					allowedOrigins: ["*"],
					allowedHeaders: ["*"],
				},
			}
		);

		// aws_s3バケットや
		const bucket_temp = new aws_s3.Bucket(this, 'temp', {
			lifecycleRules: [
				{
					// デフォルト: 180日で削除
					expiration: cdk.Duration.days(180),
				},
				{
					// "_/" プレフィックス以下は1日で削除
					prefix: '_/',
					expiration: cdk.Duration.days(1),
				},
			],
			cors: [{
				allowedMethods: [aws_s3.HttpMethods.GET, aws_s3.HttpMethods.PUT, aws_s3.HttpMethods.POST, aws_s3.HttpMethods.HEAD],
				allowedOrigins: ['*'],
				allowedHeaders: ['*'],
			}],
		});
		const bucket_main = new aws_s3.Bucket(this, 'main');

		// Lambdaにアクセス権限あげるで
		bucket_temp.grantReadWrite(apiFunction);
		bucket_main.grantReadWrite(apiFunction);
		apiFunction.addToRolePolicy(new aws_iam.PolicyStatement({
			actions: ['ses:SendEmail', 'ses:SendRawEmail'],
			resources: [
				`arn:aws:ses:ap-northeast-1:${this.account}:identity/*`,
				`arn:aws:ses:ap-northeast-1:${this.account}:configuration-set/*`,
			],
		}));

		// Lambdaに環境変数渡すで
		apiFunction.addEnvironment('BUCKET_TEMP', bucket_temp.bucketName);
		apiFunction.addEnvironment('BUCKET_MAIN', bucket_main.bucketName);

		// CloudFrontディストリビューションや
		const distribution = new cloudfront.Distribution(this, 'ApiDistribution', {
			defaultBehavior: {
				origin: new origins.FunctionUrlOrigin(functionUrl),
				viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
				allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
				cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // 動的APIやからキャッシュは無効にしとくで
				originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
			},
		});

		new cdk.CfnOutput(this, 'FunctionUrl', { value: functionUrl.url });
		new cdk.CfnOutput(this, 'DistributionDomainName', { value: distribution.domainName });
	}
}

const docker_image_function = (
	construct: Construct,
	id: string,
	directory: string,
	props_lambda?: Omit<cdk.aws_lambda.DockerImageFunctionProps, "code">,
	props_url?: Omit<cdk.aws_lambda.FunctionUrlOptions, "authType">
) => {
	//https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda.DockerImageFunction.html
	const lambda = new cdk.aws_lambda.DockerImageFunction(construct, id, {
		code: cdk.aws_lambda.DockerImageCode.fromImageAsset(directory,),
		...props_lambda
	});
	const lambda_url = lambda.addFunctionUrl({
		authType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
		...props_url
	})
	return { lambda, lambda_url }
}
