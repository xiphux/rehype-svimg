# rehype-svimg

rehype-svimg is a [rehype](https://github.com/rehypejs/rehype) plugin for preprocessing and lazy loading images using the [svimg](https://github.com/xiphux/svimg) Svelte component. Image tags are replaced with the svimg component as a [custom element](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements), which means it can be used without Svelte.

## Getting Started

### Installation

```bash
npm install -D rehype-svimg
```

Since svimg (and by proxy rehype-svimg) uses [sharp](https://sharp.pixelplumbing.com), you'll also want to make sure rehype-svimg is treated as an external by your bundler. For example, for Rollup, in `rollup.config.js`:

```js
export default {
    external: ['rehype-svimg']
};
```

### Usage

#### Basic usage

rehype-svimg is a fairly standard rehype plugin. For example, to transform Markdown to HTML using svimg for images:

```markdown
Example markdown content.

![My image alt text](assets/images/image.jpg)

More markdown content.
```

```js
import unified from 'unified';
import markdown from 'remark-parse';
import remark2rehype from 'remark-rehype';
import rehypeSvimg from 'rehype-svimg';
import html from 'rehype-stringify';

const processor = unified()
    .use(markdown)
    .use(remark2rehype)
    .use(rehypeSvimg, {
        inputDir: 'static',
        outputDir: 'static/g',
        webp: true,
    })
    .use(html);
const htmlContent = await processor.process(markdownContent);
```

By default, the plugin will only populate the component and its appropriate srcset attributes without actually creating the resized image files, instead expecting the resizing to have been already been done during build (for example, with a rollup plugin).

#### With image generation

It's possible to have remark-rehype do the actual image resizing. This avoids the need for a separate build plugin, but means the code will run significantly slower to do the resize. This might be acceptable for something like an exported static site, but could be problematic for something like a live production or development web server.

```js
const processor = unified()
    .use(markdown)
    .use(remark2rehype)
    .use(rehypeSvimg, {
        inputDir: 'static',
        outputDir: 'static/g',
        webp: true,
        generateImages: true,
    })
    .use(html);
const htmlContent = await processor.process(markdownContent);
```

#### Image widths

Images can be defaulted to a specific width with the `width` parameter. All images without an existing width will be explicitly limited in the srcset to this width:

```js
const processor = unified()
    .use(markdown)
    .use(remark2rehype)
    .use(rehypeSvimg, {
        inputDir: 'static',
        outputDir: 'static/g',
        webp: true,
        width: 500,
    })
    .use(html);
const htmlContent = await processor.process(markdownContent);
```

Images can also have their widths specified on an image-by-image basis, and this will be respected by rehype-svimg when generating the image srcset. An image-specific width will take precedence over the width option passed to the plugin.

Since Markdown does not have a standard syntax for specifying image width, the most straightforward way to do this is to use an actual `<img>` tag in Markdown, and use the [rehype-raw](https://github.com/rehypejs/rehype-raw) plugin to handle the HTML in the markdown:

```markdown
Example markdown content.

<img src="assets/images/image.jpg" alt="My image alt text" width="500" />

More markdown content.
```

```js
import unified from 'unified';
import markdown from 'remark-parse';
import remark2rehype from 'remark-rehype';
import raw from 'rehype-raw';
import rehypeSvimg from 'rehype-svimg';
import html from 'rehype-stringify';

const processor = unified()
    .use(markdown)
    .use(remark2rehype, { allowDangerousHtml: true })
    .use(raw)
    .use(rehypeSvimg, {
        inputDir: 'static',
        outputDir: 'static/g',
        webp: true,
    })
    .use(html);
const htmlContent = await processor.process(markdownContent);
```

### Configuration

#### Plugin options

| Option         | Default    |           |
| -------------- | ---------- | --------- |
| inputDir       | *required* | The static asset directory where image urls are retrieved from |
| outputDir      | *required* | The output directory where resized image files should be written to |
| webp           | true       | Whether to generate WebP versions of images in addition to the original image formats |
| width          |            | Default width for images. Images that do not have a width set will use this width |
| generateImages | false     | Whether to generate the actual resized image files in addition to the appropriate component attributes |

## Built With

* [unified](https://unifiedjs.com)
* [svimg](https://github.com/xiphux/svimg)

## Authors

* **Chris Han** - *Initial work* - [xiphux](https://github.com/xiphux)

## License

This project is licensed under the ISC License - see the [LICENSE.md](LICENSE.md) file for details
