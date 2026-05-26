const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#f5f5f5',
    alignItems: 'center', 
    justifyContent: 'center', // Wait, let's push it to the top so the keyboard doesn't hide it
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  input: {
    height: 55,
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 18,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  ticketCard: {
    marginTop: 40,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Shadow for Android
  },
  airline: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  status: {
    fontSize: 14,
    color: '#28a745', // A nice "success" green
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 5,
    fontWeight: '600',
  },
  cityLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  airportCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111',
  },
  details: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#333',
  },
  scheduledTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    textDecorationLine: 'line-through', // This creates the crossed-out effect
    marginTop: 5,
  },
  actualTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc3545', // Red to immediately highlight the new time
    marginTop: 2,
  },
  delayedTimeContainer: {
    alignItems: 'center',
  },
  delayText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 11,
    color: '#007bff', // Blue to indicate active flight status
    fontWeight: '700',
    marginTop: 2,
  },
  routeContainer: {
    width: '100%',
    marginTop: 10,
  },
  citiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  cityBlockLeft: {
    alignItems: 'flex-start',
  },
  cityBlockRight: {
    alignItems: 'flex-end',
  },
  delayedTimeContainerLeft: {
    alignItems: 'flex-start',
  },
  delayedTimeContainerRight: {
    alignItems: 'flex-end',
  },
  progressSection: {
    width: '100%',
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  totalTimeText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 24,
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 3,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    width: '100%',
    position: 'absolute',
  },
  progressBarFill: {
    height: 3,
    backgroundColor: '#5a9b2b', // FlightAware Green
    borderRadius: 2,
    position: 'absolute',
  },
  progressPlaneIcon: {
    position: 'absolute',
    fontSize: 22,
    marginLeft: -11, // Keeps the nose of the plane exactly on the percentage line
    top: 0,
    color: '#5a9b2b',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressPill: {
    backgroundColor: '#6c8194', // FlightAware Blue/Grey pill
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  progressLabelText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
  },
  planeIcon: {
    fontSize: 24,
  },
  emptyStateContainer: {
    flex: 1, // Tells it to fill all the available empty space below the search bar
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    marginTop: -40, // Pulls it up slightly so it feels perfectly centered
  },
  emptyStateIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22, // Adds breathing room between the lines of text
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    marginTop: -40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#d9534f', // A premium, muted red
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  timeStackLeft: {
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  timeStackRight: {
    alignItems: 'flex-end',
    marginVertical: 4,
  },
  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  scheduledTime: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through', // The strikethrough magic
    marginBottom: -2, // Pulls the actual time up slightly so they group together visually
  },
  actualTime: {
    fontSize: 20,
    fontWeight: 'bold',
    // We let the inline style dynamically inject the red or green color here!
  },
  skeletonHeader: {
    height: 24,
    width: '60%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonSubHeader: {
    height: 16,
    width: '40%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 20,
  },
  skeletonCityBlockLeft: {
    alignItems: 'flex-start',
  },
  skeletonCityBlockRight: {
    alignItems: 'flex-end',
  },
  skeletonLabel: {
    height: 12,
    width: 50,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonCode: {
    height: 32,
    width: 80,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonTime: {
    height: 20,
    width: 60,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  skeletonProgressBar: {
    height: 8,
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 15,
  }
});