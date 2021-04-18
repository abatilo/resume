import * as awsx from "@pulumi/awsx";
import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";
import * as pulumi from "@pulumi/pulumi";

const appName = "resume";

const clusterStackRef = new pulumi.StackReference("prod");
const kubeconfig = clusterStackRef.getOutput("kubeconfig");
const k8sProvider = new k8s.Provider("prod", {
  kubeconfig: kubeconfig.apply(JSON.stringify),
});
const repository = new awsx.ecr.Repository(appName);
const image = repository.buildAndPushImage("./");
const pod = new kx.PodBuilder({
  containers: [
    {
      image,
      ports: { http: 80 },
    },
  ],
});
const deployment = new kx.Deployment(
  appName,
  {
    metadata: {
      namespace: "applications",
    },
    spec: pod.asDeploymentSpec({
      replicas: 2,
      strategy: { rollingUpdate: { maxUnavailable: 0 } },
    }),
  },
  { provider: k8sProvider }
);
const service = deployment.createService();

const pdb = new k8s.policy.v1beta1.PodDisruptionBudget(
  appName,
  {
    metadata: {
      namespace: deployment.metadata.namespace,
    },
    spec: {
      maxUnavailable: 1,
      selector: deployment.spec.selector,
    },
  },
  { provider: k8sProvider }
);

const ingressMiddleware = new k8s.apiextensions.CustomResource(
  appName,
  {
    apiVersion: "traefik.containo.us/v1alpha1",
    kind: "Middleware",
    metadata: { namespace: deployment.metadata.namespace },
    spec: {
      headers: {
        forceSTSHeader: true,
        stsSeconds: 31536000,
        stsIncludeSubdomains: true,
        stsPreload: true,
        referrerPolicy: "no-referrer-when-downgrade",
        contentTypeNosniff: true,
        contentSecurityPolicy: "upgrade-insecure-requests",
        browserXssFilter: true,
        customFrameOptionsValue: "SAMEORIGIN",
        customResponseHeaders: {
          "Permissions-Policy":
            "geolocation=(); midi=(); notifications=(); push=(); sync-xhr=(); microphone=(); camera=(); magnetometer=(); gyroscope=(); speaker=(self); vibrate=(); fullscreen=(self); payment=();",
        },
      },
    },
  },
  { provider: k8sProvider }
);

const ingressRoute = new k8s.apiextensions.CustomResource(
  appName,
  {
    apiVersion: "traefik.containo.us/v1alpha1",
    kind: "IngressRoute",
    metadata: {
      namespace: deployment.metadata.namespace,
    },
    spec: {
      entryPoints: ["websecure"],
      routes: [
        {
          match:
            "Host(`www.aaronbatilo.dev`) && (Path(`/resume`) || Path(`/resume.pdf`))",
          kind: "Rule",
          middlewares: [{ name: ingressMiddleware.metadata.name }],
          services: [
            { name: service.metadata.name, port: service.spec.ports[0].port },
          ],
        },
      ],
    },
  },
  { provider: k8sProvider }
);
