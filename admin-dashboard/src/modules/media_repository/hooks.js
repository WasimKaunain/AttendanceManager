import { useEffect, useState } from "react";
import { fetchMedia } from "./services";

export const useMedia = (prefix, search) => {
  const [data, setData] = useState({
    folders: [],
    files: [],
    next_token: null
  });

  const [loading, setLoading] = useState(false);

  const loadMedia = async (token = null, append = false) => {
    setLoading(true);
    try {
      const res = await fetchMedia({ prefix, search, token });

      setData(prev => ({
        folders: res.folders,
        files: append ? [...prev.files, ...res.files] : res.files,
        next_token: res.next_token
      }));

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [prefix, search]);

  return { data, loading, loadMore: () => loadMedia(data.next_token, true) };
};