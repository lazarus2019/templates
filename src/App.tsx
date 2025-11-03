import {
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
} from '@tanstack/react-query';
import './App.css';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';

export type PaginatedProducts = {
  data: Product[];
  total: number;
  cursor: string | null;
};

export type Product = {
  createdAt: string;
  name: string;
  avatar: string;
  company: string;
  id: string;
};

type ProductParams = {
  name: string;
  pageNo: number;
  pageSize: number;
  cursor?: string;
};

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
});

const getProducts = () => {
  return axiosInstance.get<PaginatedProducts>('/products');
};

const searchProducts = (params: ProductParams) => {
  return axiosInstance.get<PaginatedProducts>('/products/search', {
    params,
  });
};

const getProductQueryOptions = () => {
  return queryOptions({
    queryKey: ['products'],
    queryFn: getProducts,
  });
};

const getSearchProductInfiniteQueryOptions = (
  params: Partial<ProductParams> & Required<Pick<ProductParams, 'name'>>
) => {
  const { name, cursor, pageNo = 1, pageSize = 10 } = params;

  const queryParams: ProductParams = {
    name,
    pageNo,
    pageSize,
    cursor,
  };
  // <TQueryFnData, TError = DefaultError, TData = InfiniteData<TQueryFnData>, TQueryKey extends QueryKey = QueryKey, TPageParam = unknown>
  return infiniteQueryOptions({
    queryKey: ['products', 'search', queryParams],
    initialPageParam: {
      pageNo: 1,
      cursor: '',
    },
    queryFn: async ({
      pageParam,
    }: {
      pageParam: {
        pageNo: number;
        cursor: string;
      };
    }) => {
      const response = await searchProducts({
        ...queryParams,
        ...pageParam,
        cursor: pageParam.cursor || undefined,
      });

      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.cursor) {
        return {
          pageNo: allPages.length + 1,
          cursor: lastPage.cursor,
        };
      }
      return undefined;
    },
    select: (data) => ({
      pages: data.pages.flatMap((page) => page.data),
      pageParams: data.pageParams,
      total: data.pages[0].total ?? 0,
      cursor: data.pages[data.pages.length - 1].cursor,
    }),
  });
};

function App() {
  // const [cursor, setCursor] = useState<string>();

  // const paramMemo = useMemo(
  //   () => ({
  //     name: 'a',
  //     cursor,
  //   }),
  //   [cursor]
  // );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(getSearchProductInfiniteQueryOptions({ name: 'a' }));

  useEffect(() => {
    console.log('Fetched Data:', data);
    console.count();

    if (data) {
      // setCursor(data.cursor || undefined);
    }
  }, [data]);

  return (
    <div className="App">
      <h1>Product List</h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(200px, 1fr))',
          gap: '10px',
        }}
      >
        {data?.pages.map((product) => (
          <div
            key={product.id}
            style={{
              border: '1px solid black',
              margin: '10px',
              padding: '10px',
            }}
          >
            <h2>{product.name}</h2>
            <p>Company: {product.company}</p>
            <img src={product.avatar} alt={product.name} width={100} />
            <p>
              Created At: {new Date(product.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
      <div>
        <button
          onClick={() => fetchNextPage()}
          disabled={!hasNextPage || isFetchingNextPage}
        >
          {isFetchingNextPage
            ? 'Loading more...'
            : hasNextPage
            ? 'Load More'
            : 'No more products'}
        </button>
      </div>
    </div>
  );
}

export default App;
