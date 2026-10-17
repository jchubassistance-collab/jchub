declare module 'gray-matter' {
  type GrayMatterFile = {
    content: string;
    data: Record<string, unknown>;
    orig: string;
  };

  export default function matter(input: string): GrayMatterFile;
}
