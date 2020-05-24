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
      strategy: {
        rollingUpdate: {
          maxUnavailable: 0,
        },
      },
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

const service = new k8s.core.v1.Service(
  appName,
  {
    metadata: { labels: appLabels },
    spec: {
      selector: appLabels,
      type: "ClusterIP",
      ports: [
        {
          name: "http",
          port: 80,
          targetPort: 80,
        },
      ],
    },
  },
  { provider: k8sProvider }
);

const ingress = new k8s.extensions.v1beta1.Ingress(
  appName,
  {
    metadata: {
      labels: appLabels,
      annotations: {
        "kubernetes.io/ingress.class": "traefik",
        "ingress.kubernetes.io/force-hsts": "true",
        "ingress.kubernetes.io/hsts-max-age": "315360000",
        "ingress.kubernetes.io/hsts-include-subdomains": "true",
        "ingress.kubernetes.io/hsts-preload": "true",
        "ingress.kubernetes.io/browser-xss-filter": "true",
        "ingress.kubernetes.io/content-type-nosniff": "true",
        "ingress.kubernetes.io/custom-frame-options-value": "SAMEORIGIN",
        "ingress.kubernetes.io/referrer-policy": "no-referrer-when-downgrade",
        "ingress.kubernetes.io/content-security-policy":
          "upgrade-insecure-requests",
        "ingress.kubernetes.io/custom-response-headers":
          "Feature-Policy: geolocation none; midi none; notifications none; push none; sync-xhr none; microphone none; camera none; magnetometer none; gyroscope none; speaker self; vibrate none; fullscreen self; payment none; ||",
      },
    },
    spec: {
      rules: [
        {
          host: "www.aaronbatilo.dev",
          http: {
            paths: [
              {
                path: "/resume",
                backend: {
                  serviceName: service.metadata.name,
                  servicePort: service.spec.ports[0].port,
                },
              },
              {
                path: "/resume.pdf",
                backend: {
                  serviceName: service.metadata.name,
                  servicePort: service.spec.ports[0].port,
                },
              },
            ],
          },
        },
      ],
    },
  },
  { provider: k8sProvider }
);
