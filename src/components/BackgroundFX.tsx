const BackgroundFX = () => <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
  <div className="absolute inset-0 bg-gradient-page" />
  <div className="absolute -left-[20rem] -top-[18rem] h-[34rem] w-[34rem] rounded-full bg-primary/10 blur-[120px]" />
  <div className="absolute -right-[20rem] top-1/3 h-[38rem] w-[38rem] rounded-full bg-accent/10 blur-[140px]" />
  <div className="absolute inset-0 grid-lines opacity-20" />
</div>;

export default BackgroundFX;
