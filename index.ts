import * as awsx from "@pulumi/awsx";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

const clusterStackRef = new pulumi.StackReference("prod");
const kubeconfig = clusterStackRef.getOutput("kubeconfig");
const k8sProvider = new k8s.Provider("prod", {
  kubeconfig,
});

const appName = "resume";
const repository = new awsx.ecr.Repository(appName);
const image = repository.buildAndPushImage("./");

const appLabels = { app: appName };

const deployment = new k8s.apps.v1.Deployment(
  appName,
  {
    metadata: { labels: appLabels },
    spec: {
      replicas: 2,
      selector: { matchLabels: appLabels },
      template: {
        metadata: { labels: appLabels },
        spec: {
          containers: [
            {
              name: appName,
              image,
              ports: [{ name: "http", containerPort: 80 }],
            },
          ],
        },
      },
    },
  },
  { provider: k8sProvider }
);
