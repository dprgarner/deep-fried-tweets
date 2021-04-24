const { fabric } = require("fabric");

const initBulgeFilter = () => {
  /**
   * A quick 'n dirty bulge filter.
   * Ideas taken from: https://github.com/evanw/glfx.js/blob/master/src/filters/warp/bulgepinch.js
   * (but ported to Canvas)
   */
  const Bulge = fabric.util.createClass(fabric.Image.filters.BaseFilter, {
    type: "Bulge",
    strength: 0,
    mainParameter: "strength",

    applyTo2d: function (options) {
      if (
        this.x === undefined ||
        this.y === undefined ||
        !this.strength ||
        this.strength < 0 ||
        !this.radius
      ) {
        return;
      }

      const {
        imageData: { data: targetData },
        sourceWidth,
        sourceHeight,
      } = options;

      let i, j, source, target, d2;
      const { x, y, strength, radius } = this;
      const r2 = radius * radius;
      let di, dj;
      let targetI, targetJ;
      let percent;

      const sourceData = targetData.slice(0);

      for (i = 0; i < sourceHeight; i++) {
        for (j = 0; j < sourceWidth; j++) {
          target = 4 * (i * sourceWidth + j);
          d2 = Math.pow(i - y, 2) + Math.pow(j - x, 2);

          if (d2 < r2) {
            percent = 1 - Math.sqrt(d2 / r2);

            di = Math.floor(-strength * percent * (i - y));
            dj = Math.floor(-strength * percent * (j - x));

            targetI = Math.floor(Math.min(sourceHeight, Math.max(0, i + di)));
            targetJ = Math.floor(Math.min(sourceWidth, Math.max(0, j + dj)));

            source = 4 * (targetI * sourceWidth + targetJ);
            targetData[target] = sourceData[source];
            targetData[target + 1] = sourceData[source + 1];
            targetData[target + 2] = sourceData[source + 2];
            targetData[target + 3] = sourceData[source + 3];
          }
        }
      }
    },
  });

  fabric.Image.filters.Bulge = Bulge;
};

module.exports = initBulgeFilter;
