import { Transformer } from 'unified';
import visit from 'unist-util-visit';
import { Node } from 'unist';
import { ImageProcessingQueue, PlaceholderQueue, generateComponentAttributes } from 'svimg/dist/process';

interface RehypeSvimgOptions {
    inputDir: string;
    outputDir: string;
    webp?: boolean;
    width?: number;
    generateImages?: boolean;
}

interface ImageNode {
    type: 'element';
    tagName: string;
    properties: {
        [attr: string]: string;
    },
}

export default function rehypeSvimg(options?: RehypeSvimgOptions): Transformer {

    if (!options?.inputDir) {
        throw new Error('Input dir is required');
    }
    if (!options?.outputDir) {
        throw new Error('Output dir is required');
    }

    const processingQueue = new ImageProcessingQueue();
    const placeholderQueue = new PlaceholderQueue();

    return async function transformer(tree, file): Promise<Node> {

        const imageNodes: ImageNode[] = [];

        visit(tree, { type: 'element', tagName: 'img' }, (node: Node) => {
            imageNodes.push(node as any as ImageNode);
        });

        for (const node of imageNodes) {
            if (!(node.properties && node.properties.src)) {
                continue;
            }

            let width: number | undefined;
            if (node.properties.width) {
                if (/^[0-9]+$/.test(node.properties.width)) {
                    width = parseInt(node.properties.width, 10);
                }
            } else if (options?.width) {
                width = options.width;
            }

            const attributes = await generateComponentAttributes({
                src: node.properties.src,
                processingQueue,
                placeholderQueue,
                inputDir: options.inputDir,
                outputDir: options.outputDir,
                webp: options.webp,
                widths: width ? [width] : undefined,
                skipGeneration: !(options?.generateImages),
            });

            Object.assign(node.properties, attributes);
            if (options?.width && !node.properties.width) {
                node.properties.width = options.width.toString();
            }
            node.tagName = 's-image';
        }

        return tree;
    }
}