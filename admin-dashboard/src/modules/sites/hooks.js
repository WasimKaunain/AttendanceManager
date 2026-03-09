import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {getSites,createSite,updateSite,deleteSite,getProjects,getSiteById,getWorkers,getSiteAttendance,archiveSite,toggleSiteStatus} from "./services";

export const useSites = () => 
  {
    const queryClient = useQueryClient();

    const sitesQuery = useQuery({queryKey: ["sites"],queryFn: getSites,});

    const projectsQuery = useQuery({queryKey: ["projects"],queryFn: getProjects,});

    const createMutation = useMutation( {mutationFn: createSite, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sites"] }), onError: () => {}, } );

    const updateMutation = useMutation( {mutationFn: updateSite, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sites"] }), onError: () => {}, } );

    const deleteMutation = useMutation( {mutationFn: deleteSite,onSuccess: () =>queryClient.invalidateQueries({ queryKey: ["sites"] }),} );

    return { sitesQuery,projectsQuery,createMutation,updateMutation,deleteMutation, };
  };

export const useSiteProfile = (id, filters) => 
  {
    const queryClient = useQueryClient();

    const siteQuery = useQuery({queryKey: ["site", id],queryFn: () => getSiteById(id),});

    const workersQuery = useQuery({queryKey: ["workers"],queryFn: getWorkers,});

    const attendanceQuery = useQuery({ queryKey: ["site-attendance", id, filters.worker_id, filters.start_date, filters.end_date], queryFn: () => getSiteAttendance({site_id: id,...filters,}),enabled: filters.tab === "attendance",});

    const archiveMutation = useMutation({ mutationFn: (payload) => archiveSite({id,payload}),onSuccess: () => {queryClient.invalidateQueries(["site", id]);queryClient.invalidateQueries(["sites"]);},});

    const toggleMutation = useMutation({mutationFn: () => toggleSiteStatus({id,status:siteQuery.data?.status === "active" ? "inactive": "active",}),onSuccess: () =>queryClient.invalidateQueries(["site", id]),});

    const updateMutation = useMutation({mutationFn: updateSite, onSuccess: () => {queryClient.invalidateQueries({ queryKey: ["site", id] });queryClient.invalidateQueries({ queryKey: ["sites"] });}, onError: () => {},});
    
    return { siteQuery,workersQuery,attendanceQuery,archiveMutation,toggleMutation,updateMutation,};
  };