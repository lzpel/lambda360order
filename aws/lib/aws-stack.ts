import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

export class AwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda Function (Docker Image from ../api directory)
    // Uses AWS Lambda Web Adapter inside the image
    const { lambda: apiFunction, lambda_url: functionUrl } = docker_image_function(
      this,
      "ApiFunction",
      path.join(__dirname, "..", "..", "api"),
      {
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
      },
      {
        cors: {
          allowedMethods: [lambda.HttpMethod.ALL],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      }
    );

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'ApiDistribution', {
      defaultBehavior: {
        origin: new origins.FunctionUrlOrigin(functionUrl),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // Disable caching for dynamic API
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