import { Transformer } from 'unified';
import visit from 'unist-util-visit';
import { Node } from 'unist';
import { Queue, generateComponentAttributes } from 'svimg/dist/process';

export interface RehypeSvimgOptions {
    inputDir: string;
    outputDir: string;
    webp?: boolean;
    width?: number;
    blur?: number;
    quality?: number;
    generateImages?: boolean;
    srcPrefix?: string;
}

interface ImageNode {
    type: 'element';
    tagName: string;
    properties: {
        [attr: string]: string;
    },
}

const TAG_NAME = 's-image';

function getIntOption(props: { [attr: string]: string }, options: RehypeSvimgOptions, prop: 'width' | 'quality'): number | undefined {
    const propVal = props[prop];

    if (propVal) {
        if (/^[0-9]+$/.test(propVal)) {
            return parseInt(propVal, 10);
        }
    } else if (options && options[prop]) {
        return options[prop];
    }

    return undefined;
}

export default function rehypeSvimg(options?: RehypeSvimgOptions): Transformer {

    if (!options?.inputDir) {
        throw new Error('Input dir is required');
    }
    if (!options?.outputDir) {
        throw new Error('Output dir is required');
    }

    const queue = new Queue();

    return async function transformer(tree, file): Promise<Node> {

        const imageNodes: ImageNode[] = [];

        visit(tree, { type: 'element', tagName: 'img' }, (node: Node) => {
            imageNodes.push(node as any as ImageNode);
        });

        if (options.srcPrefix && !options.srcPrefix.endsWith('/')) {
            options.srcPrefix += '/';
        }

        await Promise.all(imageNodes.map(async (node) => {
            if (!(node.properties && node.properties.src)) {
                return;
            }

            const width = getIntOption(node.properties, options, 'width');
            const quality = getIntOption(node.properties, options, 'quality');

            let src = node.properties.src;
            if (options.srcPrefix) {
                src = options.srcPrefix + src;
            }

            const immediate = node.properties.immediate === '' || node.properties.immediate === 'true';

            const attributes = await generateComponentAttributes({
                src,
                queue,
                inputDir: options.inputDir,
                outputDir: options.outputDir,
                webp: options.webp,
                widths: width ? [width] : undefined,
                quality,
                skipGeneration: !(options?.generateImages),
                skipPlaceholder: immediate || undefined,
            });

            Object.assign(node.properties, attributes);
            if (src !== node.properties.src) {
                node.properties.src = src;
            }
            if (options?.width && !node.properties.width) {
                node.properties.width = options.width.toString();
            }
            if (options?.blur && !node.properties.blur) {
                node.properties.blur = options.blur.toString();
            }
            if (options?.quality && !node.properties.quality) {
                node.properties.quality = options.quality.toString();
            }
            node.tagName = TAG_NAME;
        }));

        return tree;
    }
}