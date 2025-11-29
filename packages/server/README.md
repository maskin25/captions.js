# @captionsjs/server

## Running CLI methods with files

1. Build the image:
   ```bash
   cd packages/server
   npm run docker:build
   ```
2. Mount the directory that contains your local file into the container and pass the argument using the `--name @/path` syntax:
   ```bash
   docker run --rm \
     -v /absolute/path/to/assets:/data \
     captionsjs-server \
     burnCaptions --captionsFile @/data/captions.json --preset Lovly
   ```

The runner reads the file inside the container, so make sure the path (e.g. `/data/captions.json`) exists in the container’s filesystem—usually via a bind mount as shown above.

You can also pass inline strings instead of files by omitting the `@` prefix (e.g. `--captionsFile '{"items":[]}'`).
