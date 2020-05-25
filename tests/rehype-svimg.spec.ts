import rehypeSvimg from '../src/rehype-svimg';
import visit from 'unist-util-visit';
import { Queue, generateComponentAttributes } from 'svimg/dist/process';

jest.mock('unist-util-visit', () => ({
    default: jest.fn()
}));
jest.mock('svimg/dist/process');

describe('rehypeSvimg', () => {

    beforeEach(() => {
        (visit as any as jest.Mock).mockReset();
        (Queue as jest.Mock).mockReset();
        (generateComponentAttributes as jest.Mock).mockReset();
    });

    it('requires an input dir', () => {
        expect(() => rehypeSvimg({
            inputDir: '',
            outputDir: 'static/g',
        })).toThrow();
    });

    it('requires an output dir', () => {
        expect(() => rehypeSvimg({
            inputDir: 'static',
            outputDir: '',
        })).toThrow();
    });

    it('does nothing without img elements', async () => {
        const queue = { enqueue: jest.fn() };
        (Queue as jest.Mock).mockReturnValue(queue);
        (visit as any as jest.Mock).mockImplementation((node: any, test: any, visitor: Function) => {
            visitor({
                type: 'text',
                value: '.',
                position: {
                    start: { line: 4, column: 387, offset: 668 },
                    end: { line: 4, column: 388, offset: 669 }
                }
            });
        });
        const tree = { tree: true };

        const transformer = rehypeSvimg({
            inputDir: 'static',
            outputDir: 'static/g',
        });

        expect(await transformer(tree as any, {} as any)).toEqual(tree);

        expect(visit).toHaveBeenCalledWith(tree, { type: 'element', tagName: 'img' }, expect.any(Function));

        expect(generateComponentAttributes).not.toHaveBeenCalled();
    });

    it('updates img elements', async () => {
        const node1 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1'
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const node2 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2'
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const queue = { enqueue: jest.fn() };
        (Queue as jest.Mock).mockReturnValue(queue);
        (visit as any as jest.Mock).mockImplementation((node: any, test: any, visitor: Function) => {
            visitor(node1);
            visitor(node2);
        });
        const tree = { tree: true };
        (generateComponentAttributes as jest.Mock).mockImplementationOnce(() => Promise.resolve({
            srcset: 'test-layer-1.jpg 500w',
            srcsetwebp: 'test-layer-1.webp 500w',
            placeholder: '<svg />'
        })).mockImplementationOnce(() => Promise.resolve({
            srcset: 'test-layer-2.jpg 500w',
            srcsetwebp: 'test-layer-2.webp 500w',
            placeholder: '<svg />'
        }));

        const transformer = rehypeSvimg({
            inputDir: 'static',
            outputDir: 'static/g',
        });

        expect(await transformer(tree as any, {} as any)).toEqual(tree);

        expect(visit).toHaveBeenCalledWith(tree, { type: 'element', tagName: 'img' }, expect.any(Function));

        expect(generateComponentAttributes).toHaveBeenCalledTimes(2);
        expect(generateComponentAttributes).toHaveBeenCalledWith({
            src: 'images/posts/2020-03-14/test-layer-1.jpg',
            queue,
            inputDir: 'static',
            outputDir: 'static/g',
            skipGeneration: true,
        });
        expect(generateComponentAttributes).toHaveBeenCalledWith({
            src: 'images/posts/2020-03-14/test-layer-2.jpg',
            queue,
            inputDir: 'static',
            outputDir: 'static/g',
            skipGeneration: true,
        });

        expect(node1).toEqual({
            type: 'element',
            tagName: 's-image',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1',
                srcset: 'test-layer-1.jpg 500w',
                srcsetwebp: 'test-layer-1.webp 500w',
                placeholder: '<svg />',
            },
            children: [],
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        });
        expect(node2).toEqual({
            type: 'element',
            tagName: 's-image',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2',
                srcset: 'test-layer-2.jpg 500w',
                srcsetwebp: 'test-layer-2.webp 500w',
                placeholder: '<svg />'
            },
            children: [],
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        });
    });

    it('updates img elements with explicit widths', async () => {
        const node1 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1',
                width: '500'
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const node2 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2',
                width: '100%'
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const queue = { enqueue: jest.fn() };
        (Queue as jest.Mock).mockReturnValue(queue);
        (visit as any as jest.Mock).mockImplementation((node: any, test: any, visitor: Function) => {
            visitor(node1);
            visitor(node2);
        });
        const tree = { tree: true };
        (generateComponentAttributes as jest.Mock).mockImplementationOnce(() => Promise.resolve({
            srcset: 'test-layer-1.jpg 500w',
            srcsetwebp: 'test-layer-1.webp 500w',
            placeholder: '<svg />'
        })).mockImplementationOnce(() => Promise.resolve({
            srcset: 'test-layer-2.jpg 400w',
            srcsetwebp: 'test-layer-2.webp 400w',
            placeholder: '<svg />'
        }));

        const transformer = rehypeSvimg({
            inputDir: 'static',
            outputDir: 'static/g',
        });

        expect(await transformer(tree as any, {} as any)).toEqual(tree);

        expect(visit).toHaveBeenCalledWith(tree, { type: 'element', tagName: 'img' }, expect.any(Function));

        expect(generateComponentAttributes).toHaveBeenCalledTimes(2);
        expect(generateComponentAttributes).toHaveBeenCalledWith({
            src: 'images/posts/2020-03-14/test-layer-1.jpg',
            queue,
            inputDir: 'static',
            outputDir: 'static/g',
            skipGeneration: true,
            widths: [500],
        });
        expect(generateComponentAttributes).toHaveBeenCalledWith({
            src: 'images/posts/2020-03-14/test-layer-2.jpg',
            queue,
            inputDir: 'static',
            outputDir: 'static/g',
            skipGeneration: true,
        });

        expect(node1).toEqual({
            type: 'element',
            tagName: 's-image',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1',
                srcset: 'test-layer-1.jpg 500w',
                srcsetwebp: 'test-layer-1.webp 500w',
                placeholder: '<svg />',
                width: '500'
            },
            children: [],
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        });
        expect(node2).toEqual({
            type: 'element',
            tagName: 's-image',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2',
                srcset: 'test-layer-2.jpg 400w',
                srcsetwebp: 'test-layer-2.webp 400w',
                placeholder: '<svg />',
                width: '100%'
            },
            children: [],
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        });
    });

    it('updates img elements without webp', async () => {
        const node1 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1',
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const node2 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2',
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const queue = { enqueue: jest.fn() };
        (Queue as jest.Mock).mockReturnValue(queue);
        (visit as any as jest.Mock).mockImplementation((node: any, test: any, visitor: Function) => {
            visitor(node1);
            visitor(node2);
        });
        const tree = { tree: true };
        (generateComponentAttributes as jest.Mock).mockImplementationOnce(() => Promise.resolve({
            srcset: 'test-layer-1.jpg 500w',
            placeholder: '<svg />'
        })).mockImplementationOnce(() => Promise.resolve({
            srcset: 'test-layer-2.jpg 400w',
            placeholder: '<svg />'
        }));

        const transformer = rehypeSvimg({
            inputDir: 'static',
            outputDir: 'static/g',
            webp: false,
        });

        expect(await transformer(tree as any, {} as any)).toEqual(tree);

        expect(visit).toHaveBeenCalledWith(tree, { type: 'element', tagName: 'img' }, expect.any(Function));

        expect(generateComponentAttributes).toHaveBeenCalledTimes(2);
        expect(generateComponentAttributes).toHaveBeenCalledWith({
            src: 'images/posts/2020-03-14/test-layer-1.jpg',
            queue,
            inputDir: 'static',
            outputDir: 'static/g',
            skipGeneration: true,
            webp: false,
        });
        expect(generateComponentAttributes).toHaveBeenCalledWith({
            src: 'images/posts/2020-03-14/test-layer-2.jpg',
            queue,
            inputDir: 'static',
            outputDir: 'static/g',
            skipGeneration: true,
            webp: false,
        });

        expect(node1).toEqual({
            type: 'element',
            tagName: 's-image',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1',
                srcset: 'test-layer-1.jpg 500w',
                placeholder: '<svg />',
            },
            children: [],
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        });
        expect(node2).toEqual({
            type: 'element',
            tagName: 's-image',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2',
                srcset: 'test-layer-2.jpg 400w',
                placeholder: '<svg />',
            },
            children: [],
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        });
    });

    it('updates img elements with a configured width', async () => {
        const node1 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1'
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const node2 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2'
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const queue = { enqueue: jest.fn() };
        (Queue as jest.Mock).mockReturnValue(queue);
        (visit as any as jest.Mock).mockImplementation((node: any, test: any, visitor: Function) => {
            visitor(node1);
            visitor(node2);
        });
        const tree = { tree: true };
        (generateComponentAttributes as jest.Mock).mockImplementationOnce(() => Promise.resolve({
            srcset: 'test-layer-1.jpg 600w',
            srcsetwebp: 'test-layer-1.webp 600w',
            placeholder: '<svg />'
        })).mockImplementationOnce(() => Promise.resolve({
            srcset: 'test-layer-2.jpg 600w',
            srcsetwebp: 'test-layer-2.webp 600w',
            placeholder: '<svg />'
        }));

        const transformer = rehypeSvimg({
            inputDir: 'static',
            outputDir: 'static/g',
            width: 600,
        });

        expect(await transformer(tree as any, {} as any)).toEqual(tree);

        expect(visit).toHaveBeenCalledWith(tree, { type: 'element', tagName: 'img' }, expect.any(Function));

        expect(generateComponentAttributes).toHaveBeenCalledTimes(2);
        expect(generateComponentAttributes).toHaveBeenCalledWith({
            src: 'images/posts/2020-03-14/test-layer-1.jpg',
            queue,
            inputDir: 'static',
            outputDir: 'static/g',
            skipGeneration: true,
            widths: [600],
        });
        expect(generateComponentAttributes).toHaveBeenCalledWith({
            src: 'images/posts/2020-03-14/test-layer-2.jpg',
            queue,
            inputDir: 'static',
            outputDir: 'static/g',
            skipGeneration: true,
            widths: [600],
        });

        expect(node1).toEqual({
            type: 'element',
            tagName: 's-image',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1',
                srcset: 'test-layer-1.jpg 600w',
                srcsetwebp: 'test-layer-1.webp 600w',
                placeholder: '<svg />',
                width: '600',
            },
            children: [],
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        });
        expect(node2).toEqual({
            type: 'element',
            tagName: 's-image',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2',
                srcset: 'test-layer-2.jpg 600w',
                srcsetwebp: 'test-layer-2.webp 600w',
                placeholder: '<svg />',
                width: '600',
            },
            children: [],
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        });
    });

    it('uses explicit widths over configured widths', async () => {
        const node1 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1',
                width: '500',
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const node2 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2',
                width: '100%',
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const node3 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-3.jpg',
                alt: 'Test layer 3',
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const queue = { enqueue: jest.fn() };
        (Queue as jest.Mock).mockReturnValue(queue);
        (visit as any as jest.Mock).mockImplementation((node: any, test: any, visitor: Function) => {
            visitor(node1);
            visitor(node2);
            visitor(node3);
        });
        const tree = { tree: true };
        (generateComponentAttributes as jest.Mock).mockImplementationOnce(() => Promise.resolve({
            srcset: 'test-layer-1.jpg 500w',
            srcsetwebp: 'test-layer-1.webp 500w',
            placeholder: '<svg />'
        })).mockImplementationOnce(() => Promise.resolve({
            srcset: 'test-layer-2.jpg 600w',
            srcsetwebp: 'test-layer-2.webp 600w',
            placeholder: '<svg />'
        }))
            .mockImplementationOnce(() => Promise.resolve({
                srcset: 'test-layer-3.jpg 600w',
                srcsetwebp: 'test-layer-3.webp 600w',
                placeholder: '<svg />'
            }));

        const transformer = rehypeSvimg({
            inputDir: 'static',
            outputDir: 'static/g',
            width: 600,
        });

        expect(await transformer(tree as any, {} as any)).toEqual(tree);

        expect(visit).toHaveBeenCalledWith(tree, { type: 'element', tagName: 'img' }, expect.any(Function));

        expect(generateComponentAttributes).toHaveBeenCalledTimes(3);
        expect(generateComponentAttributes).toHaveBeenCalledWith({
            src: 'images/posts/2020-03-14/test-layer-1.jpg',
            queue,
            inputDir: 'static',
            outputDir: 'static/g',
            skipGeneration: true,
            widths: [500],
        });
        expect(generateComponentAttributes).toHaveBeenCalledWith({
            src: 'images/posts/2020-03-14/test-layer-2.jpg',
            queue,
            inputDir: 'static',
            outputDir: 'static/g',
            skipGeneration: true,
        });
        expect(generateComponentAttributes).toHaveBeenCalledWith({
            src: 'images/posts/2020-03-14/test-layer-3.jpg',
            queue,
            inputDir: 'static',
            outputDir: 'static/g',
            skipGeneration: true,
            widths: [600],
        });

        expect(node1).toEqual({
            type: 'element',
            tagName: 's-image',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1',
                srcset: 'test-layer-1.jpg 500w',
                srcsetwebp: 'test-layer-1.webp 500w',
                placeholder: '<svg />',
                width: '500',
            },
            children: [],
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        });
        expect(node2).toEqual({
            type: 'element',
            tagName: 's-image',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2',
                srcset: 'test-layer-2.jpg 600w',
                srcsetwebp: 'test-layer-2.webp 600w',
                placeholder: '<svg />',
                width: '100%',
            },
            children: [],
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        });
        expect(node3).toEqual({
            type: 'element',
            tagName: 's-image',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-3.jpg',
                alt: 'Test layer 3',
                srcset: 'test-layer-3.jpg 600w',
                srcsetwebp: 'test-layer-3.webp 600w',
                placeholder: '<svg />',
                width: '600',
            },
            children: [],
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        });
    });

    it('updates img elements with image generation if requested', async () => {
        const node1 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1'
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const node2 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2'
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const queue = { process: jest.fn() };
        (Queue as jest.Mock).mockReturnValue(queue);
        (visit as any as jest.Mock).mockImplementation((node: any, test: any, visitor: Function) => {
            visitor(node1);
            visitor(node2);
        });
        const tree = { tree: true };
        (generateComponentAttributes as jest.Mock).mockImplementationOnce(() => Promise.resolve({
            srcset: 'test-layer-1.jpg 500w',
            srcsetwebp: 'test-layer-1.webp 500w',
            placeholder: '<svg />'
        })).mockImplementationOnce(() => Promise.resolve({
            srcset: 'test-layer-2.jpg 500w',
            srcsetwebp: 'test-layer-2.webp 500w',
            placeholder: '<svg />'
        }));

        const transformer = rehypeSvimg({
            inputDir: 'static',
            outputDir: 'static/g',
            generateImages: true,
        });

        expect(await transformer(tree as any, {} as any)).toEqual(tree);

        expect(visit).toHaveBeenCalledWith(tree, { type: 'element', tagName: 'img' }, expect.any(Function));

        expect(generateComponentAttributes).toHaveBeenCalledTimes(2);
        expect(generateComponentAttributes).toHaveBeenCalledWith({
            src: 'images/posts/2020-03-14/test-layer-1.jpg',
            queue,
            inputDir: 'static',
            outputDir: 'static/g',
            skipGeneration: false,
        });
        expect(generateComponentAttributes).toHaveBeenCalledWith({
            src: 'images/posts/2020-03-14/test-layer-2.jpg',
            queue,
            inputDir: 'static',
            outputDir: 'static/g',
            skipGeneration: false,
        });

        expect(node1).toEqual({
            type: 'element',
            tagName: 's-image',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1',
                srcset: 'test-layer-1.jpg 500w',
                srcsetwebp: 'test-layer-1.webp 500w',
                placeholder: '<svg />',
            },
            children: [],
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        });
        expect(node2).toEqual({
            type: 'element',
            tagName: 's-image',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2',
                srcset: 'test-layer-2.jpg 500w',
                srcsetwebp: 'test-layer-2.webp 500w',
                placeholder: '<svg />'
            },
            children: [],
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        });
    });

});
