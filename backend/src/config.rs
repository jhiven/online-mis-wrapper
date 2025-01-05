#[derive(clap::Parser)]
pub struct AppConfig {
    /// The url to the redis server
    #[clap(long, env)]
    pub redis_address: String,

    /// The password to use for the redis server
    #[clap(long, env)]
    pub redis_password: String,

    /// The username to use for the redis server
    #[clap(long, env)]
    pub redis_user: String,

    /// The proxy url to use for the request client
    #[clap(long, env)]
    pub proxy_url: Option<String>,

    /// The proxy url to use for the request client
    #[clap(long, env)]
    pub server_address: Option<String>,

    /// The proxy url to use for the request client
    #[clap(long, env)]
    pub server_port: Option<u16>,
}
