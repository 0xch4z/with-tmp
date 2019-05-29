# with-tmp [![Build Status](https://travis-ci.org/charliekenney23/with-tmp.svg?branch=master)](https://travis-ci.org/charliekenney23/with-tmp) [![Greenkeeper badge](https://badges.greenkeeper.io/Charliekenney23/with-tmp.svg)](https://greenkeeper.io/)

### Easily create a temporary directory without having to worry about cleanup.

```typescript
import withTmpdir from "with-tmp";

await withTmpdir("my-tmp-dir", dir => {
  const path = path.join(dir, "my-file");
  fs.writeFileSync(path, "content");
}); // tmpdir is cleaned up
```

### Do tasks from within the temporary directory without having to worry about restoring your environment.

```typescript
import { withinTmpdir } from "with-tmp";

process.cwd(); // => /home/me/workspace
await withinTmpdir("my-other-tmp-dir", dir => {
  process.cwd(); // => /private/var/folders/83/5913m0b1080000gn/T/my-other-tmp-dir2Ivp7V
});
```
