declare module 'gray-matter' {
  type GrayMatterFile = {
    content: string;
    data: Record<string, unknown>;
    orig: string;
  };

  function matter(input: string): GrayMatterFile;
  namespace matter {
    /** Front matter followed by the content, which always gets a final line break. */
    function stringify(content: string, data: Record<string, unknown>): string;
  }
  export default matter;
}
