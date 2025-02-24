export default function Page() {

  // const postsQuery = trpc.post.list.useInfiniteQuery(
  //   {
  //     limit: 5,
  //   },
  //   {
  //     getNextPageParam(lastPage) {
  //       return lastPage.nextCursor;
  //     },
  //   },
  // );

  // const addPost = trpc.post.add.useMutation({
  //   async onSuccess() {
  //     console.log('Post added');
  //   },
  // });

  // prefetch all posts for instant navigation
  // useEffect(() => {
  //   const allPosts = postsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  //   for (const { id } of allPosts) {
  //     void utils.post.byId.prefetch({ id });
  //   }
  // }, [postsQuery.data, utils]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-center">Welcome to Badminton Match</h1>
        <p className="text-center text-xl">
          Explore rankings, matches, and connect with badminton players!
        </p>
      </div>
    </div>
  );
}

/**
 * If you want to statically render this page
 * - Export `appRouter` & `createContext` from [trpc].ts
 * - Make the `opts` object optional on `createContext()`
 *
 * @link https://trpc.io/docs/v11/ssg
 */
// export const getStaticProps = async (
//   context: GetStaticPropsContext<{ filter: string }>,
// ) => {
//   const ssg = createServerSideHelpers({
//     router: appRouter,
//     ctx: await createContext(),
//   });

//   await ssg.post.all.fetch();

//   return {
//     props: {
//       trpcState: ssg.dehydrate(),
//       filter: context.params?.filter ?? 'all',
//     },
//     revalidate: 1,
//   };
// };
