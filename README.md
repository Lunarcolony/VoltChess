

## Stack

Built with [Next.js](https://nextjs.org/docs), [React](https://react.dev/learn/describing-the-ui), [Material UI](https://mui.com/material-ui/getting-started/overview/), and [TypeScript](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html).

Deployed on AWS with [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/home.html), see it live [here](https://chesskit.org).

## Running the app in dev mode

> [!IMPORTANT]  
> At least [Node.js](https://nodejs.org) 22.11 is required.

Install the dependencies :

```bash
npm i
```

Run the development server :

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in the browser to see the app running.

The app will automatically refresh on any source file change.

## Lint

Run it with :

```bash
npm run lint
```

## Contribute

See [contributing](CONTRIBUTING.md) for details on how to contribute to the project.

## Deploy

To deploy the app, install [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) and [authenticate](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-quickstart.html), then run :

```bash
npm run deploy
```

## License

Chesskit is licensed under the GNU Affero General Public License 3. See [copying](COPYING.md) for
details.
