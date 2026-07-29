import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('furniture thumbnails stay within the decoded-memory budget', () => {
  const thumbnailDirectory = path.resolve('src/furniture/image');
  const thumbnailFiles = fs.readdirSync(thumbnailDirectory)
    .filter((name) => name.endsWith('.png') && name !== 'placeholder.png');

  for (const name of thumbnailFiles) {
    const data = fs.readFileSync(path.join(thumbnailDirectory, name));
    assert.equal(data.toString('ascii', 1, 4), 'PNG', `${name} must remain a valid PNG`);
    const width = data.readUInt32BE(16);
    const height = data.readUInt32BE(20);
    assert.ok(
      width <= 256 && height <= 256,
      `${name} is ${width}x${height}; thumbnail dimensions must not exceed 256px`
    );
  }
});
