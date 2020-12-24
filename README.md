## rainbowtype secure IoT prototype development client

## Environment

Windows10 20H2 (19042.630) PC

## Install

Download Visual studio Installer and install.
https://visualstudio.microsoft.com/ja/thank-you-downloading-visual-studio/?sku=BuildTools

In Visual Studio Installer, install Visual Studio Build Tools 2017(15.9.29)

Download Python 2.7.18 and install it at c:\Python27.
https://www.python.org/ftp/python/2.7.18/python-2.7.18.amd64.msi

Download Python 3.8.6 and install it at c:\Python38.
https://www.python.org/ftp/python/3.8.6/python-3.8.6-amd64.exe

Download nodejs 14.15.1 and install.
https://nodejs.org/dist/v14.15.1/node-v14.15.1-x64.msi

run cmd.exe as an administrator role and execute:

```bash
yarn global add windows-build-tools
```

clone the repo via git and install dependencies:

```
git clone --depth 1 --single-branch https://github.com/kmwebnet/rainbowtype-client.git
cd rainbowtype-client
yarn
c:\Python38\python.exe -m pip install -r requirements.txt

```

## Packaging for Production

To package apps for the local platform:

```bash
yarn package
```

Please make sure if you transfer this app to the other PC, you also setup python environment as follows:

Download Python 3.8.6 and install it at c:\Python38.
https://www.python.org/ftp/python/3.8.6/python-3.8.6-amd64.exe

install python dependencies

```
c:\Python38\python.exe -m pip install -r requirements.txt
```

<p>
  This project was created using the Electron-react-boilerplate.
  Therefore, users are free to customize, publish and use the app.
</p>

<a href="https://github.com/electron-react-boilerplate/electron-react-boilerplate"><img src="internals/img/erb-banner.png" width="100%" /></a>

<br>

<p>
  Electron React Boilerplate uses <a href="https://electron.atom.io/">Electron</a>, <a href="https://facebook.github.io/react/">React</a>, <a href="https://github.com/reactjs/redux">Redux</a>, <a href="https://github.com/reactjs/react-router">React Router</a>, <a href="https://webpack.github.io/docs/">Webpack</a> and <a href="https://github.com/gaearon/react-hot-loader">React Hot Loader</a> for rapid application development (HMR).
</p>

<br>

<div align="center">
  <a href="https://facebook.github.io/react/"><img src="./internals/img/react-padded-90.png" /></a>
  <a href="https://webpack.github.io/"><img src="./internals/img/webpack-padded-90.png" /></a>
  <a href="https://redux.js.org/"><img src="./internals/img/redux-padded-90.png" /></a>
  <a href="https://github.com/ReactTraining/react-router"><img src="./internals/img/react-router-padded-90.png" /></a>
  <a href="https://eslint.org/"><img src="./internals/img/eslint-padded-90.png" /></a>
  <a href="https://facebook.github.io/jest/"><img src="./internals/img/jest-padded-90.png" /></a>
  <a href="https://yarnpkg.com/"><img src="./internals/img/yarn-padded-90.png" /></a>
</div>

<hr />
<br />

## Starting Development

Start the app in the `dev` environment. This starts the renderer process in [**hot-module-replacement**](https://webpack.js.org/guides/hmr-react/) mode and starts a webpack dev server that sends hot updates to the renderer process:

```bash
yarn dev
```

## Docs

See our [docs and guides here](https://electron-react-boilerplate.js.org/docs/installation)

## Donations

**Donations will ensure the following:**

- 🔨 Long term maintenance of the project
- 🛣 Progress on the [roadmap](https://electron-react-boilerplate.js.org/docs/roadmap)
- 🐛 Quick responses to bug reports and help requests

## Backers

Support us with a monthly donation and help us continue our activities. [[Become a backer](https://opencollective.com/electron-react-boilerplate#backer)]

<a href="https://opencollective.com/electron-react-boilerplate/backer/0/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/0/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/1/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/1/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/2/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/2/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/3/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/3/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/4/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/4/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/5/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/5/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/6/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/6/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/7/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/7/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/8/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/8/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/9/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/9/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/10/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/10/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/11/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/11/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/12/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/12/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/13/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/13/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/14/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/14/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/15/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/15/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/16/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/16/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/17/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/17/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/18/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/18/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/19/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/19/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/20/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/20/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/21/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/21/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/22/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/22/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/23/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/23/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/24/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/24/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/25/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/25/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/26/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/26/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/27/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/27/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/28/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/28/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/backer/29/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/backer/29/avatar.svg"></a>

## Sponsors

Become a sponsor and get your logo on our README on Github with a link to your site. [[Become a sponsor](https://opencollective.com/electron-react-boilerplate-594#sponsor)]

<a href="https://opencollective.com/electron-react-boilerplate/sponsor/0/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/1/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/2/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/3/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/4/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/5/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/6/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/7/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/8/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/9/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/9/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/10/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/10/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/11/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/11/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/12/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/12/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/13/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/13/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/14/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/14/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/15/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/15/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/16/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/16/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/17/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/17/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/18/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/18/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/19/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/19/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/20/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/20/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/21/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/21/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/22/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/22/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/23/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/23/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/24/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/24/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/25/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/25/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/26/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/26/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/27/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/27/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/28/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/28/avatar.svg"></a>
<a href="https://opencollective.com/electron-react-boilerplate/sponsor/29/website" target="_blank"><img src="https://opencollective.com/electron-react-boilerplate/sponsor/29/avatar.svg"></a>

## Maintainers

- [Amila Welihinda](https://github.com/amilajack)
- [John Tran](https://github.com/jooohhn)
- [C. T. Lin](https://github.com/chentsulin)
- [Jhen-Jie Hong](https://github.com/jhen0409)

## License

MIT © [Electron React Boilerplate](https://github.com/electron-react-boilerplate)  
Contains multiple license types.  
please check [fossology report](https://github.com/kmwebnet/rainbowtype-client/raw/master/rainbowtype-client_clearing_report_Wed_Nov_25_11_2020_06_10_59.docx)  included this repo.   


[github-actions-status]: https://github.com/electron-react-boilerplate/electron-react-boilerplate/workflows/Test/badge.svg
[github-actions-url]: https://github.com/electron-react-boilerplate/electron-react-boilerplate/actions
[github-tag-image]: https://img.shields.io/github/tag/electron-react-boilerplate/electron-react-boilerplate.svg?label=version
[github-tag-url]: https://github.com/electron-react-boilerplate/electron-react-boilerplate/releases/latest
[stackoverflow-img]: https://img.shields.io/badge/stackoverflow-electron_react_boilerplate-blue.svg
[stackoverflow-url]: https://stackoverflow.com/questions/tagged/electron-react-boilerplate
[david-image]: https://img.shields.io/david/electron-react-boilerplate/electron-react-boilerplate.svg
[david-url]: https://david-dm.org/electron-react-boilerplate/electron-react-boilerplate
[david-dev-image]: https://img.shields.io/david/dev/electron-react-boilerplate/electron-react-boilerplate.svg?label=devDependencies
[david-dev-url]: https://david-dm.org/electron-react-boilerplate/electron-react-boilerplate?type=dev
[good-first-issue-image]: https://img.shields.io/github/issues/electron-react-boilerplate/electron-react-boilerplate/good%20first%20issue.svg?label=good%20first%20issues
[good-first-issue-url]: https://github.com/electron-react-boilerplate/electron-react-boilerplate/issues?q=is%3Aopen+is%3Aissue+label%3A"good+first+issue"
