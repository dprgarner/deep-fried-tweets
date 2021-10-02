const countPixels = ({ map, w, h }, { x, y, dh, dw }) => {
  const lowerThreshold = 64;
  const upperThreshold = 196;

  let totalBlack = 0;
  let totalWhite = 0;
  for (let i = y; i < Math.min(y + dh, h); i++) {
    for (let j = x; j < Math.min(x + dw, w); j++) {
      if (
        map.data[4 * (i * w + j)] < lowerThreshold &&
        map.data[4 * (i * w + j) + 1] < lowerThreshold &&
        map.data[4 * (i * w + j) + 2] < lowerThreshold
      ) {
        totalBlack += 1;
      }
      if (
        map.data[4 * (i * w + j)] > upperThreshold &&
        map.data[4 * (i * w + j) + 1] > upperThreshold &&
        map.data[4 * (i * w + j) + 2] > upperThreshold
      ) {
        totalWhite += 1;
      }
    }
  }

  return [totalBlack, totalWhite];
};

function shouldGoDark(event, canvas) {
  canvas.renderAll();
  const ctx = canvas.getContext("2d");
  const w = Math.floor(canvas.width);
  const h = Math.floor(canvas.height);
  const map = ctx.getImageData(0, 0, w, h);
  let totalBlack = 0;
  let totalWhite = 0;

  for (const { x, y, width, height } of event.bounds.media) {
    const [black, white] = countPixels(
      { map, w, h },
      { x, y, dw: width, dh: height }
    );
    totalBlack += black;
    totalWhite += white;
  }

  if (totalWhite !== 0 && totalBlack !== 0) {
    const percentBlack = totalBlack / (totalBlack + totalWhite);
    if (percentBlack < 0.3) return false;
    if (percentBlack > 0.7) return true;
  }

  return Math.random() < 0.25;
}

function selectMode(
  event,
  { canvas: lightCanvas, image: lightImage },
  { canvas: darkCanvas, image: darkImage }
) {
  return shouldGoDark(event, lightCanvas)
    ? {
        mode: "dark",
        canvas: darkCanvas,
        image: darkImage,
      }
    : {
        mode: "light",
        canvas: lightCanvas,
        image: lightImage,
      };
}

module.exports = selectMode;
