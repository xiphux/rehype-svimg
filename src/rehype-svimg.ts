import { Transformer } from 'unified';
import visit from 'unist-util-visit';
import { Node } from 'unist';
import { Queue, generateComponentAttributes } from 'svimg/dist/process';

export interface RehypeSvimgOptions {
    inputDir: string;
    outputDir: string;
    webp?: boolean;
    width?: number;
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

            let width: number | undefined;
            if (node.properties.width) {
                if (/^[0-9]+$/.test(node.properties.width)) {
                    width = parseInt(node.properties.width, 10);
                }
            } else if (options?.width) {
                width = options.width;
            }

            let src = node.properties.src;
            if (options.srcPrefix) {
                src = options.srcPrefix + src;
            }

            const attributes = await generateComponentAttributes({
                src,
                queue,
                inputDir: options.inputDir,
                outputDir: options.outputDir,
                webp: options.webp,
                widths: width ? [width] : undefined,
                skipGeneration: !(options?.generateImages),
            });

            Object.assign(node.properties, attributes);
            if (src !== node.properties.src) {
                node.properties.src = src;
            }
            if (options?.width && !node.properties.width) {
                node.properties.width = options.width.toString();
            }
            node.tagName = TAG_NAME;
        }));

        return tree;
    }
}