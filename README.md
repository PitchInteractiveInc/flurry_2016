
# Flurry

Source code for our holiday cards and associated website.

You can read more in
[our blog post](http://pitchinteractive.com/latest/happy-holidata/)
or check out the website here http://pitchinteractive.com/flurry2016/.
You can export the svg files for AxiDraw [here](http://pitchinteractive.com/flurry2016/?cards).

## Development

### Setup

After cloning the repository, run:

    npm i

### Running

Run

    npm start

Then access `http://localhost:8000/`.

### Deploying

To generate deployable assets, run:

    npm run build

They will be written to `dist/`.

## Dependencies

JavaScript is written in [ES2015](https://babeljs.io/docs/learn-es2015/)
using [Babel](https://babeljs.io/). Styles are written in
[SASS](http://sass-lang.com/). All assets are preprocessed with
[webpack](https://webpack.github.io/).

# License

This software is distributed under the [ISC](https://spdx.org/licenses/ISC.html)
license.
